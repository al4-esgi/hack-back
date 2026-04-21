import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { CreateUserDto } from "src/users/_utils/dto/request/create-user.dto";
import { UsersService } from "src/users/users.service";
import { EnvironmentVariables } from "../_utils/config/env.config";
import { ConfirmRecoverAccountPasswordDto } from "./_utils/dto/request/confirm-recover-account-password.dto";
import { LoginDto } from "./_utils/dto/request/login.dto";
import { RecoverAccountPasswordDto } from "./_utils/dto/request/recover-account-password.dto";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register user." })
  register(@Body() body: CreateUserDto) {
    // return this.usersService.createUser(body);
  }

  @Post("login")
  @ApiOperation({ summary: "Login user." })
  login(@Body() body: LoginDto) {
    // return this.authService.login(body);
  }

  @HttpCode(204)
  @Post("recover-password")
  @ApiOperation({ summary: "Send a mail with a recovery link." })
  recoverAccountPassword(@Body() body: RecoverAccountPasswordDto) {
    // return this.authService.recoverAccountPassword(body);
  }

  @HttpCode(204)
  @Post("confirm-recover-password")
  @ApiOperation({ summary: "Confirm the recover password with token" })
  confirmRecoverAccountPassword(
    @Body() body: ConfirmRecoverAccountPasswordDto,
  ) {
    // return this.authService.confirmRecoverAccountPassword(body);
  }

  @Get("instagram")
  @UseGuards(AuthGuard("instagram"))
  @ApiOperation({ summary: "Instagram OAuth2 - Redirect to Instagram" })
  @ApiQuery({
    name: "redirect",
    required: false,
    description: "Optional redirect URL",
  })
  async instagramAuth(@Req() req: Request) {
    return;
  }

  @Get("instagram/callback")
  @UseGuards(AuthGuard("instagram"))
  @ApiOperation({ summary: "Instagram OAuth2 - Callback handler" })
  async instagramAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const jwt = this.authService.generateJwt(user);
    const frontUrl = this.configService.get("FRONT_URL");

    return res.redirect(
      `http://localhost:5173/auth/instagram/callback?token=${jwt}`,
    );
  }
}
